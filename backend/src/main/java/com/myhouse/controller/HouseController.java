package com.myhouse.controller;

import com.myhouse.dto.response.ApiResponse;
import com.myhouse.dto.response.HouseResponse;
import com.myhouse.dto.response.ZoneResponse;
import com.myhouse.entity.House;
import com.myhouse.entity.Zone;
import com.myhouse.service.HouseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/houses")
@RequiredArgsConstructor
public class HouseController {

    private final HouseService houseService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<HouseResponse>>> getMyHouses(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.success(houseService.getMyHouses(ud.getUsername())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<HouseResponse>> createHouse(
            @RequestBody House house,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.success("집 등록 완료", houseService.createHouse(ud.getUsername(), house)));
    }

    @GetMapping("/{houseId}")
    public ResponseEntity<ApiResponse<HouseResponse>> getHouse(
            @PathVariable Long houseId,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.success(houseService.getHouse(houseId, ud.getUsername())));
    }

    @PutMapping("/{houseId}")
    public ResponseEntity<ApiResponse<HouseResponse>> updateHouse(
            @PathVariable Long houseId,
            @RequestBody House house,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.success("집 정보 수정 완료", houseService.updateHouse(houseId, ud.getUsername(), house)));
    }

    @DeleteMapping("/{houseId}")
    public ResponseEntity<ApiResponse<Void>> deleteHouse(
            @PathVariable Long houseId,
            @AuthenticationPrincipal UserDetails ud) {
        houseService.deleteHouse(houseId, ud.getUsername());
        return ResponseEntity.ok(ApiResponse.success("집 삭제 완료", null));
    }

    // 구역(Zone) API - 물품 수 포함
    @GetMapping("/{houseId}/zones")
    public ResponseEntity<ApiResponse<List<ZoneResponse>>> getZones(
            @PathVariable Long houseId,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.success(houseService.getZones(houseId, ud.getUsername())));
    }

    @PostMapping("/{houseId}/zones")
    public ResponseEntity<ApiResponse<ZoneResponse>> addZone(
            @PathVariable Long houseId,
            @RequestBody Zone zone,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.success("구역 추가 완료", houseService.addZone(houseId, ud.getUsername(), zone)));
    }
}
