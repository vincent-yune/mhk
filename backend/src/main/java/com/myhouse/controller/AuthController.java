package com.myhouse.controller;

import com.myhouse.dto.request.LoginRequest;
import com.myhouse.dto.request.SignUpRequest;
import com.myhouse.dto.response.ApiResponse;
import com.myhouse.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<?>> signUp(@Valid @RequestBody SignUpRequest req) {
        return ResponseEntity.ok(ApiResponse.success("회원가입 성공", authService.signUp(req)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<?>> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.success("로그인 성공", authService.login(req)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<?>> getMyInfo(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(authService.getMyInfo(userDetails.getUsername())));
    }
}
