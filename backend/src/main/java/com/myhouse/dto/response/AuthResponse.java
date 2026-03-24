package com.myhouse.dto.response;

import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String accessToken;
    private String tokenType;
    private UserResponse user;

    public static AuthResponse of(String token, UserResponse user) {
        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .user(user)
                .build();
    }
}
