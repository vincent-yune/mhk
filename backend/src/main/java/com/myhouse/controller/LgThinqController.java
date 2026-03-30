package com.myhouse.controller;

import com.myhouse.dto.response.ApiResponse;
import com.myhouse.entity.IotDevice;
import com.myhouse.repository.HouseRepository;
import com.myhouse.repository.IotDeviceRepository;
import com.myhouse.service.LgThinqService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/lgthinq")
@RequiredArgsConstructor
public class LgThinqController {

    private final LgThinqService lgThinqService;
    private final IotDeviceRepository iotDeviceRepository;
    private final HouseRepository houseRepository;

    // ─── 연결 상태 확인 ───────────────────────────────────────────────────────

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus(
            @AuthenticationPrincipal UserDetails ud) {
        boolean connected = lgThinqService.hasToken(ud.getUsername());
        return ResponseEntity.ok(ApiResponse.success(Map.of("connected", connected)));
    }

    // ─── PAT 토큰 등록 & 검증 ─────────────────────────────────────────────────

    @PostMapping("/connect")
    public ResponseEntity<ApiResponse<Map<String, Object>>> connect(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails ud) {

        String token = body.get("token");
        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Personal Access Token이 필요합니다."));
        }

        // 토큰 저장 후 API 호출로 유효성 검증
        lgThinqService.saveToken(ud.getUsername(), token.trim());
        try {
            List<Map<String, Object>> devices = lgThinqService.getDevices(ud.getUsername());
            return ResponseEntity.ok(ApiResponse.success(
                    "LG ThinQ 연결 완료! " + devices.size() + "개 기기 발견",
                    Map.of("connected", true, "deviceCount", devices.size())
            ));
        } catch (Exception e) {
            lgThinqService.deleteToken(ud.getUsername());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("LG ThinQ 연결 실패: 토큰을 확인해주세요. (" + e.getMessage() + ")"));
        }
    }

    // ─── 연결 해제 ────────────────────────────────────────────────────────────

    @DeleteMapping("/connect")
    public ResponseEntity<ApiResponse<Void>> disconnect(
            @AuthenticationPrincipal UserDetails ud) {
        lgThinqService.deleteToken(ud.getUsername());
        return ResponseEntity.ok(ApiResponse.success("LG ThinQ 연결이 해제되었습니다.", null));
    }

    // ─── LG ThinQ 기기 목록 조회 (이미 등록된 기기 표시 포함) ──────────────

    @GetMapping("/devices")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDevices(
            @RequestParam(required = false) Long houseId,
            @AuthenticationPrincipal UserDetails ud) {

        List<Map<String, Object>> devices = lgThinqService.getDevices(ud.getUsername());

        // 이미 연결된 기기 ID 목록
        if (houseId != null) {
            List<String> linked = iotDeviceRepository
                    .findByHouseIdAndIsActiveTrue(houseId)
                    .stream()
                    .map(IotDevice::getLgThinqDeviceId)
                    .filter(id -> id != null && !id.isEmpty())
                    .collect(Collectors.toList());

            for (Map<String, Object> d : devices) {
                d.put("alreadyLinked", linked.contains(d.get("deviceId")));
            }
        }
        return ResponseEntity.ok(ApiResponse.success(devices));
    }

    // ─── 기기 상태 조회 ───────────────────────────────────────────────────────

    @GetMapping("/devices/{lgDeviceId}/state")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDeviceState(
            @PathVariable String lgDeviceId,
            @AuthenticationPrincipal UserDetails ud) {
        Map<String, Object> state = lgThinqService.getDeviceState(ud.getUsername(), lgDeviceId);
        return ResponseEntity.ok(ApiResponse.success(state));
    }

    // ─── 기기 제어 명령 전송 ──────────────────────────────────────────────────

    @PostMapping("/devices/{lgDeviceId}/control")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendControl(
            @PathVariable String lgDeviceId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {

        String resource = (String) body.get("resource");
        String property = (String) body.get("property");
        Object value    = body.get("value");

        Map<String, Object> result = lgThinqService.sendControl(
                ud.getUsername(), lgDeviceId, resource, property, value);
        return ResponseEntity.ok(ApiResponse.success("명령이 전송되었습니다.", result));
    }

    // ─── LG ThinQ 기기 → MyHouse 등록 ────────────────────────────────────────

    @PostMapping("/devices/{lgDeviceId}/import")
    public ResponseEntity<ApiResponse<IotDevice>> importDevice(
            @PathVariable String lgDeviceId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {

        Long houseId = Long.valueOf(body.get("houseId").toString());
        var house = houseRepository.findById(houseId)
                .orElseThrow(() -> new RuntimeException("집 정보를 찾을 수 없습니다."));
        if (!house.getUser().getEmail().equals(ud.getUsername())) {
            return ResponseEntity.status(403).body(ApiResponse.error("접근 권한이 없습니다."));
        }

        // 중복 체크
        boolean exists = iotDeviceRepository.findByHouseIdAndIsActiveTrue(houseId)
                .stream().anyMatch(d -> lgDeviceId.equals(d.getLgThinqDeviceId()));
        if (exists) {
            return ResponseEntity.badRequest().body(ApiResponse.error("이미 등록된 기기입니다."));
        }

        // LG 기기 목록에서 정보 가져오기
        List<Map<String, Object>> lgDevices = lgThinqService.getDevices(ud.getUsername());
        Map<String, Object> lgDevice = lgDevices.stream()
                .filter(d -> lgDeviceId.equals(d.get("deviceId")))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("LG ThinQ에서 기기를 찾을 수 없습니다."));

        // deviceType 결정
        String iconType = (String) lgDevice.getOrDefault("deviceTypeIcon", "OTHER");
        IotDevice.DeviceType deviceType;
        try { deviceType = IotDevice.DeviceType.valueOf(iconType); }
        catch (Exception e) { deviceType = IotDevice.DeviceType.OTHER; }

        IotDevice device = IotDevice.builder()
                .house(house)
                .name((String) lgDevice.getOrDefault("label", "LG 기기"))
                .deviceType(deviceType)
                .manufacturer("LG")
                .model((String) lgDevice.getOrDefault("modelName", ""))
                .platform(IotDevice.Platform.LG_THINQ)
                .lgThinqDeviceId(lgDeviceId)
                .status(IotDevice.DeviceStatus.ONLINE)
                .lastSeen(LocalDateTime.now())
                .isActive(true)
                .build();

        IotDevice saved = iotDeviceRepository.save(device);
        return ResponseEntity.ok(ApiResponse.success("LG 기기가 등록되었습니다!", saved));
    }

    // ─── MyHouse의 LG 기기 상태 일괄 동기화 ─────────────────────────────────

    @PostMapping("/sync/{houseId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncDevices(
            @PathVariable Long houseId,
            @AuthenticationPrincipal UserDetails ud) {

        var house = houseRepository.findById(houseId)
                .orElseThrow(() -> new RuntimeException("집 정보를 찾을 수 없습니다."));
        if (!house.getUser().getEmail().equals(ud.getUsername())) {
            return ResponseEntity.status(403).body(ApiResponse.error("접근 권한이 없습니다."));
        }

        List<IotDevice> lgDevices = iotDeviceRepository.findByHouseIdAndIsActiveTrue(houseId)
                .stream()
                .filter(d -> d.getLgThinqDeviceId() != null && !d.getLgThinqDeviceId().isEmpty())
                .collect(Collectors.toList());

        int updated = 0;
        for (IotDevice device : lgDevices) {
            try {
                Map<String, Object> state = lgThinqService.getDeviceState(
                        ud.getUsername(), device.getLgThinqDeviceId());
                String power = (String) state.get("power");
                String runState = (String) state.get("runState");
                if ("off".equals(power)) {
                    device.setStatus(IotDevice.DeviceStatus.STANDBY);
                } else if (runState != null && !"POWER_OFF".equalsIgnoreCase(runState)) {
                    device.setStatus(IotDevice.DeviceStatus.ONLINE);
                } else {
                    device.setStatus(IotDevice.DeviceStatus.ONLINE);
                }
                device.setLastSeen(LocalDateTime.now());
                iotDeviceRepository.save(device);
                updated++;
            } catch (Exception e) {
                device.setStatus(IotDevice.DeviceStatus.OFFLINE);
                iotDeviceRepository.save(device);
            }
        }
        return ResponseEntity.ok(ApiResponse.success(
                updated + "개 LG 기기 동기화 완료",
                Map.of("synced", updated, "total", lgDevices.size())
        ));
    }
}
