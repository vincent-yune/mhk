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
import java.util.Map;

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

    // ── SNS 소셜 로그인/회원가입 ──────────────────────────────────────────────────
    // body: { provider, providerId, name, email }
    @PostMapping("/social")
    public ResponseEntity<ApiResponse<?>> socialLogin(@RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(ApiResponse.success("SNS 로그인 성공", authService.socialLogin(body)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ── 이메일 찾기 ───────────────────────────────────────────────────────────────
    // body: { name, phone }
    @PostMapping("/find-email")
    public ResponseEntity<ApiResponse<?>> findEmail(@RequestBody Map<String, String> body) {
        try {
            String maskedEmail = authService.findEmail(
                body.getOrDefault("name", ""),
                body.getOrDefault("phone", "")
            );
            return ResponseEntity.ok(ApiResponse.success("이메일을 찾았습니다.", Map.of("email", maskedEmail)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ── 비밀번호 재설정 ───────────────────────────────────────────────────────────
    // body: { email, name }
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<?>> resetPassword(@RequestBody Map<String, String> body) {
        try {
            String tempPw = authService.resetPassword(
                body.getOrDefault("email", ""),
                body.getOrDefault("name", "")
            );
            return ResponseEntity.ok(ApiResponse.success(
                "임시 비밀번호가 발급되었습니다. 로그인 후 반드시 변경해주세요.",
                Map.of("tempPassword", tempPw)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
