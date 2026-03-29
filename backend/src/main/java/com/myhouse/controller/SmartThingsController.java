package com.myhouse.controller;

import com.myhouse.dto.response.ApiResponse;
import com.myhouse.entity.IotDevice;
import com.myhouse.repository.IotDeviceRepository;
import com.myhouse.repository.HouseRepository;
import com.myhouse.repository.UserRepository;
import com.myhouse.service.SmartThingsService;
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
@RequestMapping("/api/smartthings")
@RequiredArgsConstructor
public class SmartThingsController {

    private final SmartThingsService smartThingsService;
    private final IotDeviceRepository iotDeviceRepository;
    private final HouseRepository houseRepository;
    private final UserRepository userRepository;

    // ─── 연결 상태 확인 ───────────────────────────────────────────────────────

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus(
            @AuthenticationPrincipal UserDetails ud) {
        boolean connected = smartThingsService.hasToken(ud.getUsername());
        return ResponseEntity.ok(ApiResponse.success(Map.of("connected", connected)));
    }

    // ─── PAT 토큰 등록 ────────────────────────────────────────────────────────

    @PostMapping("/connect")
    public ResponseEntity<ApiResponse<Map<String, Object>>> connect(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails ud) {

        String token = body.get("token");
        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Personal Access Token이 필요합니다."));
        }

        // 토큰 유효성 검증: SmartThings API 호출
        smartThingsService.saveToken(ud.getUsername(), token.trim());

        try {
            List<Map<String, Object>> devices = smartThingsService.getSmartThingsDevices(ud.getUsername());
            return ResponseEntity.ok(ApiResponse.success(
                    "Samsung SmartThings 연결 완료! " + devices.size() + "개 기기 발견",
                    Map.of("connected", true, "deviceCount", devices.size())
            ));
        } catch (Exception e) {
            // 토큰이 유효하지 않으면 저장 롤백
            smartThingsService.deleteToken(ud.getUsername());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("SmartThings 연결 실패: 토큰을 확인해주세요. " + e.getMessage()));
        }
    }

    // ─── 연결 해제 ────────────────────────────────────────────────────────────

    @DeleteMapping("/connect")
    public ResponseEntity<ApiResponse<Void>> disconnect(
            @AuthenticationPrincipal UserDetails ud) {
        smartThingsService.deleteToken(ud.getUsername());
        return ResponseEntity.ok(ApiResponse.success("SmartThings 연결이 해제되었습니다.", null));
    }

    // ─── SmartThings 디바이스 목록 조회 (클라우드에서) ───────────────────────

    @GetMapping("/devices")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSmartThingsDevices(
            @AuthenticationPrincipal UserDetails ud) {
        List<Map<String, Object>> devices = smartThingsService.getSmartThingsDevices(ud.getUsername());
        return ResponseEntity.ok(ApiResponse.success(devices));
    }

    // ─── SmartThings 디바이스 상태 조회 ──────────────────────────────────────

    @GetMapping("/devices/{stDeviceId}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDeviceStatus(
            @PathVariable String stDeviceId,
            @AuthenticationPrincipal UserDetails ud) {
        Map<String, Object> status = smartThingsService.getDeviceStatus(ud.getUsername(), stDeviceId);
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    // ─── SmartThings 디바이스 명령 전송 ──────────────────────────────────────

    @PostMapping("/devices/{stDeviceId}/command")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendCommand(
            @PathVariable String stDeviceId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {

        String capability = (String) body.get("capability");
        String command = (String) body.get("command");
        @SuppressWarnings("unchecked")
        List<Object> args = (List<Object>) body.get("arguments");

        Map<String, Object> result = smartThingsService.sendCommand(
                ud.getUsername(), stDeviceId, capability, command, args);
        return ResponseEntity.ok(ApiResponse.success("명령이 전송되었습니다.", result));
    }

    // ─── SmartThings 디바이스를 MyHouse에 가져오기 (Import) ─────────────────

    @PostMapping("/devices/{stDeviceId}/import")
    public ResponseEntity<ApiResponse<IotDevice>> importDevice(
            @PathVariable String stDeviceId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {

        Long houseId = Long.valueOf(body.get("houseId").toString());

        // 집 존재/권한 확인
        var house = houseRepository.findById(houseId)
                .orElseThrow(() -> new RuntimeException("집 정보를 찾을 수 없습니다."));
        if (!house.getUser().getEmail().equals(ud.getUsername())) {
            return ResponseEntity.status(403)
                    .body(ApiResponse.error("접근 권한이 없습니다."));
        }

        // SmartThings에서 디바이스 정보 가져오기
        List<Map<String, Object>> stDevices = smartThingsService.getSmartThingsDevices(ud.getUsername());
        Map<String, Object> stDevice = stDevices.stream()
                .filter(d -> stDeviceId.equals(d.get("deviceId")))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("SmartThings에서 기기를 찾을 수 없습니다."));

        // 이미 연결된 기기인지 확인
        boolean exists = iotDeviceRepository.findByHouseIdAndIsActiveTrue(houseId)
                .stream()
                .anyMatch(d -> stDeviceId.equals(d.getSmartThingsDeviceId()));
        if (exists) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("이미 연결된 기기입니다."));
        }

        // 디바이스 타입 결정
        String deviceTypeStr = (String) stDevice.getOrDefault("deviceTypeIcon", "OTHER");
        IotDevice.DeviceType deviceType;
        try {
            deviceType = IotDevice.DeviceType.valueOf(deviceTypeStr);
        } catch (Exception e) {
            deviceType = IotDevice.DeviceType.OTHER;
        }

        // 제조사로 Samsung인지 확인
        String manufacturer = (String) stDevice.getOrDefault("manufacturer", "Samsung");
        if (manufacturer == null || manufacturer.isEmpty()) manufacturer = "Samsung";

        // IotDevice 생성 & 저장
        @SuppressWarnings("unchecked")
        List<String> caps = (List<String>) stDevice.getOrDefault("capabilities", List.of());

        IotDevice device = IotDevice.builder()
                .house(house)
                .name((String) stDevice.getOrDefault("label",
                        stDevice.getOrDefault("name", "Samsung 기기")))
                .deviceType(deviceType)
                .manufacturer(manufacturer)
                .model((String) stDevice.getOrDefault("model", ""))
                .platform(IotDevice.Platform.SMARTTHINGS)
                .smartThingsDeviceId(stDeviceId)
                .smartThingsCapabilities(String.join(",", caps))
                .status(IotDevice.DeviceStatus.ONLINE)
                .lastSeen(LocalDateTime.now())
                .isActive(true)
                .build();

        IotDevice saved = iotDeviceRepository.save(device);
        return ResponseEntity.ok(ApiResponse.success("기기가 연결되었습니다!", saved));
    }

    // ─── 연결된 IoT 디바이스 SmartThings 상태 일괄 동기화 ───────────────────

    @PostMapping("/sync/{houseId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncDevices(
            @PathVariable Long houseId,
            @AuthenticationPrincipal UserDetails ud) {

        var house = houseRepository.findById(houseId)
                .orElseThrow(() -> new RuntimeException("집 정보를 찾을 수 없습니다."));
        if (!house.getUser().getEmail().equals(ud.getUsername())) {
            return ResponseEntity.status(403).body(ApiResponse.error("접근 권한이 없습니다."));
        }

        List<IotDevice> devices = iotDeviceRepository.findByHouseIdAndIsActiveTrue(houseId)
                .stream()
                .filter(d -> d.getSmartThingsDeviceId() != null && !d.getSmartThingsDeviceId().isEmpty())
                .collect(java.util.stream.Collectors.toList());

        int updated = 0;
        for (IotDevice device : devices) {
            try {
                Map<String, Object> status = smartThingsService.getDeviceStatus(
                        ud.getUsername(), device.getSmartThingsDeviceId());

                // switch 상태로 ONLINE/STANDBY 결정
                String sw = (String) status.get("switch");
                if (sw != null) {
                    device.setStatus("on".equals(sw) ? IotDevice.DeviceStatus.ONLINE : IotDevice.DeviceStatus.STANDBY);
                } else {
                    device.setStatus(IotDevice.DeviceStatus.ONLINE);
                }
                device.setLastSeen(LocalDateTime.now());
                iotDeviceRepository.save(device);
                updated++;
            } catch (Exception e) {
                device.setStatus(IotDevice.DeviceStatus.OFFLINE);
                iotDeviceRepository.save(device);
                log.warn("디바이스 동기화 실패: {}", device.getSmartThingsDeviceId());
            }
        }

        return ResponseEntity.ok(ApiResponse.success(
                updated + "개 기기 동기화 완료",
                Map.of("synced", updated, "total", devices.size())
        ));
    }
}
