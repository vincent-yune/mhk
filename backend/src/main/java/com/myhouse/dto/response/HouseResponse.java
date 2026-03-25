package com.myhouse.dto.response;

import com.myhouse.entity.House;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class HouseResponse {
    private Long id;
    private String name;
    private String houseType;
    private String address;
    private BigDecimal area;
    private Integer floor;
    private Integer rooms;
    private Integer bathrooms;
    private LocalDate moveInDate;
    private BigDecimal purchasePrice;
    private BigDecimal currentPrice;
    private String theme;
    private Boolean isPrimary;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ZoneResponse> zones;

    public static HouseResponse from(House house) {
        return HouseResponse.builder()
                .id(house.getId())
                .name(house.getName())
                .houseType(house.getHouseType() != null ? house.getHouseType().name() : null)
                .address(house.getAddress())
                .area(house.getArea())
                .floor(house.getFloor())
                .rooms(house.getRooms())
                .bathrooms(house.getBathrooms())
                .moveInDate(house.getMoveInDate())
                .purchasePrice(house.getPurchasePrice())
                .currentPrice(house.getCurrentPrice())
                .theme(house.getTheme() != null ? house.getTheme().name() : null)
                .isPrimary(house.getIsPrimary())
                .createdAt(house.getCreatedAt())
                .updatedAt(house.getUpdatedAt())
                .build();
    }

    public static HouseResponse from(House house, List<ZoneResponse> zones) {
        HouseResponse r = from(house);
        return HouseResponse.builder()
                .id(r.getId())
                .name(r.getName())
                .houseType(r.getHouseType())
                .address(r.getAddress())
                .area(r.getArea())
                .floor(r.getFloor())
                .rooms(r.getRooms())
                .bathrooms(r.getBathrooms())
                .moveInDate(r.getMoveInDate())
                .purchasePrice(r.getPurchasePrice())
                .currentPrice(r.getCurrentPrice())
                .theme(r.getTheme())
                .isPrimary(r.getIsPrimary())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .zones(zones)
                .build();
    }
}
