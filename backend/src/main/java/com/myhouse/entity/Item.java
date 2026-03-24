package com.myhouse.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "items")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Item extends BaseEntity {

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @JsonIgnoreProperties({"children", "parent"})
    private Category category;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 100)
    private String brand;

    @Column(length = 200)
    private String model;

    @Column(length = 100)
    private String barcode;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 500)
    private String imageUrl;

    private LocalDate purchaseDate;

    private BigDecimal purchasePrice;

    private LocalDate warrantyExpire;

    private LocalDate expiryDate;

    @Builder.Default
    private Integer quantity = 1;

    @Column(length = 20)
    @Builder.Default
    private String unit = "EA";

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ItemStatus status = ItemStatus.ACTIVE;

    @Builder.Default
    private Boolean isConsumable = false;

    private Integer reorderLevel;

    public enum ItemStatus { ACTIVE, BROKEN, DISCARDED, SOLD }
}
