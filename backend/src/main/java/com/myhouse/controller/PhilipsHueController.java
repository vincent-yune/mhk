package com.myhouse.controller;

import com.myhouse.dto.response.ApiResponse;
import com.myhouse.entity.IotDevice;
import com.myhouse.repository.HouseRepository;
import com.myhouse.repository.IotDeviceRepository;
import com.myhouse.service.PhilipsHueService;
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
@RequestMapping("/api/philipshue")
@RequiredArgsConstructor
public class PhilipsHueController {

    private final PhilipsHueService hueService;
    private final IotDeviceRepository iotDeviceRepository;
    private final HouseRepository houseRepository;

    // ── 연결 상태 확인 ────────────────────────────────────────────────────────

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus(
            @AuthenticationPrincipal UserDetails ud) {
        boolean connected = hueService.isConnected(ud.getUsername());
        Map<String, Object> data = new java.util.LinkedHashMap<>();
        data.put("connected", connected);
        if (connected) {
            data.putAll(hueService.getBridgeInfo(ud.getUsername()));
        }
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    // ── Bridge 자동 탐색 ──────────────────────────────────────────────────────
    // Hue Discovery 서버를 통해 로컬 Bridge 목록 반환

    @GetMapping("/discover")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> discover(
            @AuthenticationPrincipal UserDetails ud) {
        List<Map<String, String>> bridges = hueService.discoverBridges();
        return ResponseEntity.ok(ApiResponse.success(bridges));
    }

    // ── Bridge username 발급 (버튼 누르기) ───────────────────────────────────
    // Bridge 물리 버튼을 누른 뒤 30초 이내 호출

    @PostMapping("/pair")
    public ResponseEntity<ApiResponse<Map<String, Object>>> pair(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails ud) {

        String bridgeIp = body.get("bridgeIp");
        if (bridgeIp == null || bridgeIp.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Bridge IP를 입력해주세요."));
        }
        try {
            String hueUsername = hueService.createUsername(bridgeIp.trim());
            hueService.saveBridge(ud.getUsername(), bridgeIp.trim(), hueUsername);
            List<Map<String, Object>> lights = hueService.getLights(ud.getUsername());
            return ResponseEntity.ok(ApiResponse.success(
                    "Philips Hue 연결 완료! " + lights.size() + "개 조명 발견",
                    Map.of("connected", true, "lightCount", lights.size(),
                           "hueUsername", hueUsername)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Hue 연결 실패: " + e.getMessage()));
        }
    }

    // ── Bridge IP + username 직접 등록 ───────────────────────────────────────

    @PostMapping("/connect")
    public ResponseEntity<ApiResponse<Map<String, Object>>> connect(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails ud) {

        String bridgeIp   = body.get("bridgeIp");
        String hueUsername = body.get("hueUsername");
        if (bridgeIp == null || bridgeIp.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Bridge IP가 필요합니다."));
        }
        if (hueUsername == null || hueUsername.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Hue Username이 필요합니다."));
        }
        // 연결 검증
        boolean valid = hueService.validateConnection(bridgeIp.trim(), hueUsername.trim());
        if (!valid) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Bridge 연결 실패: IP 또는 Username을 확인해주세요."));
        }
        hueService.saveBridge(ud.getUsername(), bridgeIp.trim(), hueUsername.trim());
        try {
            List<Map<String, Object>> lights = hueService.getLights(ud.getUsername());
            return ResponseEntity.ok(ApiResponse.success(
                    "Philips Hue 연결 완료! " + lights.size() + "개 조명 발견",
                    Map.of("connected", true, "lightCount", lights.size())
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.success(
                    "Philips Hue 연결 완료!",
                    Map.of("connected", true, "lightCount", 0)
            ));
        }
    }

    // ── 연결 해제 ─────────────────────────────────────────────────────────────

    @DeleteMapping("/connect")
    public ResponseEntity<ApiResponse<Void>> disconnect(
            @AuthenticationPrincipal UserDetails ud) {
        hueService.disconnect(ud.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Philips Hue 연결이 해제되었습니다.", null));
    }

    // ── 조명 목록 조회 (등록 여부 포함) ──────────────────────────────────────

    @GetMapping("/lights")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getLights(
            @RequestParam(required = false) Long houseId,
            @AuthenticationPrincipal UserDetails ud) {
        try {
            List<Map<String, Object>> lights = houseId != null
                    ? hueService.getLightsWithLinked(ud.getUsername(), houseId, iotDeviceRepository)
                    : hueService.getLights(ud.getUsername());
            return ResponseEntity.ok(ApiResponse.success(lights));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("조명 목록 조회 실패: " + e.getMessage()));
        }
    }

    // ── 단일 조명 상태 조회 ───────────────────────────────────────────────────

    @GetMapping("/lights/{lightId}/state")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLightState(
            @PathVariable String lightId,
            @AuthenticationPrincipal UserDetails ud) {
        Map<String, Object> state = hueService.getLightState(ud.getUsername(), lightId);
        return ResponseEntity.ok(ApiResponse.success(state));
    }

    // ── 조명 제어 ─────────────────────────────────────────────────────────────
    // body 예시: {"on": true, "bri": 200, "hue": 10000, "sat": 200, "ct": 370}

    @PutMapping("/lights/{lightId}/state")
    public ResponseEntity<ApiResponse<Map<String, Object>>> controlLight(
            @PathVariable String lightId,
            @RequestBody Map<String, Object> stateBody,
            @AuthenticationPrincipal UserDetails ud) {
        try {
            Map<String, Object> result = hueService.controlLight(
                    ud.getUsername(), lightId, stateBody);
            return ResponseEntity.ok(ApiResponse.success("조명이 제어되었습니다.", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("조명 제어 실패: " + e.getMessage()));
        }
    }

    // ── 조명 → MyHouse 등록 ───────────────────────────────────────────────────

    @PostMapping("/lights/{lightId}/import")
    public ResponseEntity<ApiResponse<IotDevice>> importLight(
            @PathVariable String lightId,
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
                .stream().anyMatch(d -> lightId.equals(d.getHueLightId()));
        if (exists) {
            return ResponseEntity.badRequest().body(ApiResponse.error("이미 등록된 조명입니다."));
        }

        // Hue 조명 정보 가져오기
        Map<String, Object> lightInfo = hueService.getLightForImport(ud.getUsername(), lightId);

        IotDevice device = IotDevice.builder()
                .house(house)
                .name((String) lightInfo.getOrDefault("name", "Hue 조명"))
                .deviceType(IotDevice.DeviceType.LIGHT)
                .manufacturer("Philips")
                .model((String) lightInfo.getOrDefault("productname", lightInfo.get("type")))
                .platform(IotDevice.Platform.PHILIPS_HUE)
                .hueLightId(lightId)
                .status(Boolean.TRUE.equals(lightInfo.get("on"))
                        ? IotDevice.DeviceStatus.ONLINE : IotDevice.DeviceStatus.STANDBY)
                .lastSeen(LocalDateTime.now())
                .isActive(true)
                .build();

        IotDevice saved = iotDeviceRepository.save(device);
        return ResponseEntity.ok(ApiResponse.success("Hue 조명이 등록되었습니다!", saved));
    }

    // ── MyHouse Hue 기기 상태 일괄 동기화 ────────────────────────────────────

    @PostMapping("/sync/{houseId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncDevices(
            @PathVariable Long houseId,
            @AuthenticationPrincipal UserDetails ud) {

        var house = houseRepository.findById(houseId)
                .orElseThrow(() -> new RuntimeException("집 정보를 찾을 수 없습니다."));
        if (!house.getUser().getEmail().equals(ud.getUsername())) {
            return ResponseEntity.status(403).body(ApiResponse.error("접근 권한이 없습니다."));
        }

        List<IotDevice> hueDevices = iotDeviceRepository.findByHouseIdAndIsActiveTrue(houseId)
                .stream()
                .filter(d -> d.getHueLightId() != null && !d.getHueLightId().isEmpty())
                .collect(Collectors.toList());

        int updated = 0;
        for (IotDevice device : hueDevices) {
            try {
                Map<String, Object> state = hueService.getLightState(
                        ud.getUsername(), device.getHueLightId());
                Boolean on = (Boolean) state.get("on");
                if (Boolean.TRUE.equals(on)) {
                    device.setStatus(IotDevice.DeviceStatus.ONLINE);
                } else {
                    device.setStatus(IotDevice.DeviceStatus.STANDBY);
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
                updated + "개 Hue 조명 동기화 완료",
                Map.of("synced", updated, "total", hueDevices.size())
        ));
    }
}
