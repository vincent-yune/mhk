package com.myhouse.controller;

import com.myhouse.dto.response.ApiResponse;
import com.myhouse.entity.IotDevice;
import com.myhouse.service.IotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/houses/{houseId}/iot")
@RequiredArgsConstructor
public class IotController {

    private final IotService iotService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<IotDevice>>> getDevices(
            @PathVariable Long houseId,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.success(iotService.getDevices(houseId, ud.getUsername())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<IotDevice>> addDevice(
            @PathVariable Long houseId,
            @RequestBody IotDevice device,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.success("기기 등록 완료", iotService.addDevice(houseId, ud.getUsername(), device)));
    }

    @PatchMapping("/{deviceId}/status")
    public ResponseEntity<ApiResponse<IotDevice>> updateStatus(
            @PathVariable Long houseId,
            @PathVariable Long deviceId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails ud) {
        IotDevice.DeviceStatus status = IotDevice.DeviceStatus.valueOf(body.get("status").toUpperCase());
        return ResponseEntity.ok(ApiResponse.success("상태 변경 완료", iotService.updateDeviceStatus(deviceId, ud.getUsername(), status)));
    }

    @DeleteMapping("/{deviceId}")
    public ResponseEntity<ApiResponse<Void>> deleteDevice(
            @PathVariable Long houseId,
            @PathVariable Long deviceId,
            @AuthenticationPrincipal UserDetails ud) {
        iotService.deleteDevice(deviceId, ud.getUsername());
        return ResponseEntity.ok(ApiResponse.success("기기 삭제 완료", null));
    }

    // 맵 마커 위치 저장
    @PatchMapping("/{deviceId}/map")
    public ResponseEntity<ApiResponse<IotDevice>> updateDeviceMap(
            @PathVariable Long houseId,
            @PathVariable Long deviceId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {
        Float mapX = body.get("mapX") != null ? ((Number) body.get("mapX")).floatValue() : null;
        Float mapY = body.get("mapY") != null ? ((Number) body.get("mapY")).floatValue() : null;
        String locationDesc = body.get("locationDesc") != null ? body.get("locationDesc").toString() : null;
        return ResponseEntity.ok(ApiResponse.success("위치 저장 완료", iotService.updateDeviceMap(deviceId, ud.getUsername(), mapX, mapY, locationDesc)));
    }
}
