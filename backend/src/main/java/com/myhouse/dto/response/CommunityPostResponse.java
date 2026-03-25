package com.myhouse.dto.response;

import com.myhouse.entity.CommunityPost;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class CommunityPostResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userGrade;
    private String title;
    private String content;
    private String postType;
    private BigDecimal price;
    private Boolean isNegotiable;
    private String status;
    private Integer viewCount;
    private String imageUrls;
    private String location;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CommunityPostResponse from(CommunityPost post) {
        return CommunityPostResponse.builder()
                .id(post.getId())
                .userId(post.getUser() != null ? post.getUser().getId() : null)
                .userName(post.getUser() != null ? post.getUser().getName() : null)
                .userGrade(post.getUser() != null && post.getUser().getGrade() != null
                        ? post.getUser().getGrade().name() : null)
                .title(post.getTitle())
                .content(post.getContent())
                .postType(post.getPostType() != null ? post.getPostType().name() : null)
                .price(post.getPrice())
                .isNegotiable(post.getIsNegotiable())
                .status(post.getStatus() != null ? post.getStatus().name() : null)
                .viewCount(post.getViewCount())
                .imageUrls(post.getImageUrls())
                .location(post.getLocation())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
