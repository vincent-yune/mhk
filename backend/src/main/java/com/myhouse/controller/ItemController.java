package com.myhouse.controller;

import com.myhouse.dto.response.ApiResponse;
import com.myhouse.dto.response.ItemResponse;
import com.myhouse.entity.Item;
import com.myhouse.service.ItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/houses/{houseId}/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ItemResponse>>> getItems(
            @PathVariable Long houseId,
            @RequestParam(required = false) Long zoneId,
            @AuthenticationPrincipal UserDetails ud) {
        List<ItemResponse> items = itemService.getItems(houseId, zoneId, ud.getUsername())
                .stream().map(ItemResponse::from).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ItemResponse>> createItem(
            @PathVariable Long houseId,
            @RequestBody Item item,
            @AuthenticationPrincipal UserDetails ud) {
        ItemResponse saved = ItemResponse.from(itemService.createItem(houseId, ud.getUsername(), item));
        return ResponseEntity.ok(ApiResponse.success("물품 등록 완료", saved));
    }

    @GetMapping("/{itemId}")
    public ResponseEntity<ApiResponse<ItemResponse>> getItem(
            @PathVariable Long houseId,
            @PathVariable Long itemId,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.success(ItemResponse.from(itemService.getItem(itemId, ud.getUsername()))));
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<ApiResponse<ItemResponse>> updateItem(
            @PathVariable Long houseId,
            @PathVariable Long itemId,
            @RequestBody Item item,
            @AuthenticationPrincipal UserDetails ud) {
        ItemResponse updated = ItemResponse.from(itemService.updateItem(itemId, ud.getUsername(), item));
        return ResponseEntity.ok(ApiResponse.success("물품 수정 완료", updated));
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
    public ResponseEntity<ApiResponse<List<ItemResponse>>> getExpiringItems(
            @PathVariable Long houseId,
            @RequestParam(defaultValue = "7") int days,
            @AuthenticationPrincipal UserDetails ud) {
        List<ItemResponse> items = itemService.getExpiringItems(houseId, ud.getUsername(), days)
                .stream().map(ItemResponse::from).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @GetMapping("/reorder")
    public ResponseEntity<ApiResponse<List<ItemResponse>>> getReorderItems(
            @PathVariable Long houseId,
            @AuthenticationPrincipal UserDetails ud) {
        List<ItemResponse> items = itemService.getReorderItems(houseId, ud.getUsername())
                .stream().map(ItemResponse::from).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(items));
    }
}
