package com.myhouse.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "iot_devices")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IotDevice extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "house_id", nullable = false)
    @JsonIgnoreProperties({"zones", "items", "iotDevices", "user"})
    private House house;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id")
    @JsonIgnoreProperties({"house", "items"})
    private Zone zone;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private DeviceType deviceType = DeviceType.OTHER;

    @Column(length = 100)
    private String manufacturer;

    @Column(length = 200)
    private String model;

    @Column(length = 200)
    private String deviceUid;

    @Column(length = 200)
    private String smartThingsDeviceId;

    @Column(columnDefinition = "TEXT")
    private String smartThingsCapabilities;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Platform platform = Platform.OTHER;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private DeviceStatus status = DeviceStatus.OFFLINE;

    @Builder.Default
    private Boolean isActive = true;

    @Column(columnDefinition = "JSON")
    private String settings;

    private LocalDateTime lastSeen;

    public enum DeviceType { LIGHT, THERMOSTAT, LOCK, CAMERA, TV, AC, WASHER, REFRIGERATOR, OTHER }
    public enum Platform { SMARTTHINGS, GOOGLE_HOME, APPLE_HOME, TUYA, OTHER }
    public enum DeviceStatus { ONLINE, OFFLINE, STANDBY }
}
