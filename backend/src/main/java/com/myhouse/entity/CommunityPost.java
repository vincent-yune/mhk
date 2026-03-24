package com.myhouse.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import javax.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "community_posts")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityPost extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"houses", "password", "createdAt", "updatedAt"})
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    @JsonIgnoreProperties({"house", "zone", "category"})
    private Item item;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PostType postType = PostType.SELL;

    private BigDecimal price;

    @Builder.Default
    private Boolean isNegotiable = false;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PostStatus status = PostStatus.ACTIVE;

    @Builder.Default
    private Integer viewCount = 0;

    @Column(columnDefinition = "JSON")
    private String imageUrls;

    @Column(length = 200)
    private String location;

    public enum PostType { SELL, BUY, SHARE, RENT, FREE }
    public enum PostStatus { ACTIVE, RESERVED, COMPLETED, CLOSED }
}
