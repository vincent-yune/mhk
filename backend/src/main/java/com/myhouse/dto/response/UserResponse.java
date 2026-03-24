package com.myhouse.dto.response;

import com.myhouse.entity.User;
import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String email;
    private String name;
    private String phone;
    private String profileImg;
    private String role;
    private String grade;
    private Integer trustScore;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .phone(user.getPhone())
                .profileImg(user.getProfileImg())
                .role(user.getRole().name())
                .grade(user.getGrade().name())
                .trustScore(user.getTrustScore())
                .build();
    }
}
