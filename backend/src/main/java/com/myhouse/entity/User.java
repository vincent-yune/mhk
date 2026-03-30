package com.myhouse.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    @JsonIgnore
    private String password;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 20)
    private String phone;

    @Column(length = 500)
    private String profileImg;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    @Builder.Default
    private Role role = Role.USER;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    @Builder.Default
    private Grade grade = Grade.BRONZE;

    @Builder.Default
    private Integer trustScore = 0;

    @Builder.Default
    private Boolean isActive = true;

    @Column(length = 500)
    @JsonIgnore
    private String smartThingsToken;

    @Column(length = 500)
    @JsonIgnore
    private String lgThinqToken;

    @Column(length = 50)
    @JsonIgnore
    private String hueBridgeIp;

    @Column(length = 200)
    @JsonIgnore
    private String hueUsername;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @JsonIgnore
    private List<House> houses = new ArrayList<>();

    public enum Role { USER, ADMIN }

    public enum Grade { BRONZE, SILVER, GOLD, PLATINUM }
}
