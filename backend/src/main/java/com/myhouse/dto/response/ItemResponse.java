package com.myhouse.dto.response;

import com.myhouse.entity.Item;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class ItemResponse {
    private Long id;
    private Long houseId;
    private Long zoneId;
    private String zoneName;
    private Long categoryId;
    private String categoryName;
    private String name;
    private String brand;
    private String model;
    private String barcode;
    private String description;
    private String imageUrl;
    private LocalDate purchaseDate;
    private BigDecimal purchasePrice;
    private LocalDate warrantyExpire;
    private LocalDate expiryDate;
    private Integer quantity;
    private String unit;
    private String status;
    private Boolean isConsumable;
    private Integer reorderLevel;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ItemResponse from(Item item) {
        return ItemResponse.builder()
                .id(item.getId())
                .houseId(item.getHouse() != null ? item.getHouse().getId() : null)
                .zoneId(item.getZone() != null ? item.getZone().getId() : null)
                .zoneName(item.getZone() != null ? item.getZone().getName() : null)
                .categoryId(item.getCategory() != null ? item.getCategory().getId() : null)
                .categoryName(item.getCategory() != null ? item.getCategory().getName() : null)
                .name(item.getName())
                .brand(item.getBrand())
                .model(item.getModel())
                .barcode(item.getBarcode())
                .description(item.getDescription())
                .imageUrl(item.getImageUrl())
                .purchaseDate(item.getPurchaseDate())
                .purchasePrice(item.getPurchasePrice())
                .warrantyExpire(item.getWarrantyExpire())
                .expiryDate(item.getExpiryDate())
                .quantity(item.getQuantity())
                .unit(item.getUnit())
                .status(item.getStatus() != null ? item.getStatus().name() : null)
                .isConsumable(item.getIsConsumable())
                .reorderLevel(item.getReorderLevel())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
