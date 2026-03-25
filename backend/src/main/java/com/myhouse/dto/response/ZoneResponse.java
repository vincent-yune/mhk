package com.myhouse.dto.response;

import com.myhouse.entity.Zone;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ZoneResponse {
    private Long id;
    private String name;
    private String zoneType;
    private String icon;
    private Integer sortOrder;
    private int itemCount;

    public static ZoneResponse from(Zone zone) {
        return ZoneResponse.builder()
                .id(zone.getId())
                .name(zone.getName())
                .zoneType(zone.getZoneType() != null ? zone.getZoneType().name() : null)
                .icon(zone.getIcon())
                .sortOrder(zone.getSortOrder())
                .itemCount(0)
                .build();
    }

    public static ZoneResponse from(Zone zone, int itemCount) {
        return ZoneResponse.builder()
                .id(zone.getId())
                .name(zone.getName())
                .zoneType(zone.getZoneType() != null ? zone.getZoneType().name() : null)
                .icon(zone.getIcon())
                .sortOrder(zone.getSortOrder())
                .itemCount(itemCount)
                .build();
    }
}
