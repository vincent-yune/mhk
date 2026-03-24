package com.myhouse.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "houses")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class House extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"houses", "password", "createdAt", "updatedAt"})
    private User user;

    @Column(nullable = false, length = 100)
    @Builder.Default
    private String name = "우리집";

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private HouseType houseType = HouseType.APARTMENT;

    @Column(length = 300)
    private String address;

    private BigDecimal area;

    private Integer floor;

    @Builder.Default
    private Integer rooms = 1;

    @Builder.Default
    private Integer bathrooms = 1;

    private LocalDate moveInDate;

    private BigDecimal purchasePrice;

    private BigDecimal currentPrice;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Theme theme = Theme.DEFAULT;

    @Builder.Default
    private Boolean isPrimary = true;

    @OneToMany(mappedBy = "house", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @JsonIgnore
    private List<Zone> zones = new ArrayList<>();

    @OneToMany(mappedBy = "house", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @JsonIgnore
    private List<Item> items = new ArrayList<>();

    @OneToMany(mappedBy = "house", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @JsonIgnore
    private List<IotDevice> iotDevices = new ArrayList<>();

    public enum HouseType { APARTMENT, HOUSE, VILLA, OFFICETEL, OTHER }
    public enum Theme { DEFAULT, MODERN, NATURAL, VINTAGE, MINIMAL }
}
