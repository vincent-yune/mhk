package com.myhouse.controller;

import com.myhouse.dto.response.ApiResponse;
import com.myhouse.entity.Item;
import com.myhouse.service.ItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/houses/{houseId}/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Item>>> getItems(
            @PathVariable Long houseId,
            @RequestParam(required = false) Long zoneId,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.success(itemService.getItems(houseId, zoneId, ud.getUsername())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Item>> createItem(
            @PathVariable Long houseId,
            @RequestBody Item item,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.success("물품 등록 완료", itemService.createItem(houseId, ud.getUsername(), item)));
    }

    @GetMapping("/{itemId}")
    public ResponseEntity<ApiResponse<Item>> getItem(
            @PathVariable Long houseId,
            @PathVariable Long itemId,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.success(itemService.getItem(itemId, ud.getUsername())));
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<ApiResponse<Item>> updateItem(
            @PathVariable Long houseId,
            @PathVariable Long itemId,
            @RequestBody Item item,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.success("물품 수정 완료", itemService.updateItem(itemId, ud.getUsername(), item)));
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(
            @PathVariable Long houseId,
            @PathVariable Long itemId,
            @AuthenticationPrincipal UserDetails ud) {
        itemService.deleteItem(itemId, ud.getUsername());
        return ResponseEntity.ok(ApiResponse.success("물품 삭제 완료", null));
    }

    @GetMapping("/expiring")
    public ResponseEntity<ApiResponse<List<Item>>> getExpiringItems(
            @PathVariable Long houseId,
            @RequestParam(defaultValue = "7") int days,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.success(itemService.getExpiringItems(houseId, ud.getUsername(), days)));
    }

    @GetMapping("/reorder")
    public ResponseEntity<ApiResponse<List<Item>>> getReorderItems(
            @PathVariable Long houseId,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.success(itemService.getReorderItems(houseId, ud.getUsername())));
    }
}
