package com.myhouse.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import javax.persistence.*;

@Entity
@Table(name = "zones")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Zone extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "house_id", nullable = false)
    @JsonIgnoreProperties({"zones", "items", "iotDevices", "user"})
    private House house;

    @Column(nullable = false, length = 50)
    private String name;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ZoneType zoneType = ZoneType.OTHER;

    @Column(length = 100)
    private String icon;

    @Builder.Default
    private Integer sortOrder = 0;

    public enum ZoneType {
        LIVING_ROOM, KITCHEN, BEDROOM, BATHROOM,
        STUDY, BALCONY, GARAGE, OTHER
    }
}
