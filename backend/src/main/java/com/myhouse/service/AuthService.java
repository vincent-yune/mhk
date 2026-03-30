package com.myhouse.service;

import com.myhouse.dto.request.LoginRequest;
import com.myhouse.dto.request.SignUpRequest;
import com.myhouse.dto.response.AuthResponse;
import com.myhouse.dto.response.UserResponse;
import com.myhouse.entity.User;
import com.myhouse.exception.DuplicateResourceException;
import com.myhouse.exception.ResourceNotFoundException;
import com.myhouse.repository.UserRepository;
import com.myhouse.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse signUp(SignUpRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new DuplicateResourceException("이미 사용 중인 이메일입니다: " + req.getEmail());
        }

        User user = User.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .name(req.getName())
                .phone(req.getPhone())
                .build();

        user = userRepository.save(user);
        String token = tokenProvider.generateToken(user.getEmail(), user.getId());
        return AuthResponse.of(token, UserResponse.from(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("이메일 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new ResourceNotFoundException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        if (!user.getIsActive()) {
            throw new ResourceNotFoundException("비활성화된 계정입니다.");
        }

        String token = tokenProvider.generateToken(user.getEmail(), user.getId());
        return AuthResponse.of(token, UserResponse.from(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getMyInfo(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        return UserResponse.from(user);
    }

    // ── SNS 소셜 로그인/회원가입 ─────────────────────────────────────────────────
    // 실제 OAuth 서버 연동 없이 프론트에서 넘어온 SNS 사용자 정보로 처리
    // (provider: KAKAO | NAVER | GOOGLE, providerId: SNS 고유 ID, name, email)
    @Transactional
    public AuthResponse socialLogin(Map<String, String> body) {
        String provider   = body.getOrDefault("provider", "").toUpperCase();
        String providerId = body.getOrDefault("providerId", "");
        String name       = body.getOrDefault("name", "");
        String email      = body.getOrDefault("email", "");

        if (provider.isEmpty() || providerId.isEmpty()) {
            throw new ResourceNotFoundException("SNS 정보가 올바르지 않습니다.");
        }

        // 기존 SNS 계정 조회
        User user = userRepository.findByProviderAndProviderId(provider, providerId)
            .orElseGet(() -> {
                // 같은 이메일 계정 있으면 연동
                if (!email.isEmpty()) {
                    return userRepository.findByEmail(email)
                        .map(existing -> {
                            existing.setProvider(provider);
                            existing.setProviderId(providerId);
                            return userRepository.save(existing);
                        })
                        .orElse(null);
                }
                return null;
            });

        // 없으면 신규 가입
        if (user == null) {
            String newEmail = email.isEmpty()
                ? provider.toLowerCase() + "_" + providerId + "@sns.myhouse.com"
                : email;
            // 이메일 중복 방지
            if (userRepository.existsByEmail(newEmail)) {
                newEmail = provider.toLowerCase() + "_" + providerId + "_" + System.currentTimeMillis() + "@sns.myhouse.com";
            }
            user = User.builder()
                .email(newEmail)
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .name(name.isEmpty() ? provider + " 사용자" : name)
                .provider(provider)
                .providerId(providerId)
                .build();
            user = userRepository.save(user);
        }

        if (!user.getIsActive()) {
            throw new ResourceNotFoundException("비활성화된 계정입니다.");
        }

        String token = tokenProvider.generateToken(user.getEmail(), user.getId());
        return AuthResponse.of(token, UserResponse.from(user));
    }

    // ── 이메일 찾기 (이름 + 전화번호) ────────────────────────────────────────────
    @Transactional(readOnly = true)
    public String findEmail(String name, String phone) {
        User user = userRepository.findByNameAndPhone(name, phone)
                .orElseThrow(() -> new ResourceNotFoundException("일치하는 계정을 찾을 수 없습니다."));
        // 이메일 마스킹: ab**@example.com
        String email = user.getEmail();
        int atIdx = email.indexOf('@');
        String local = email.substring(0, atIdx);
        String domain = email.substring(atIdx);
        String masked = local.length() <= 2
            ? local + "**"
            : local.substring(0, 2) + "*".repeat(local.length() - 2);
        return masked + domain;
    }

    // ── 비밀번호 재설정 (이메일 확인 후 임시 비밀번호 발급) ─────────────────────
    @Transactional
    public String resetPassword(String email, String name) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("등록되지 않은 이메일입니다."));

        if (!user.getName().equals(name)) {
            throw new ResourceNotFoundException("이름이 일치하지 않습니다.");
        }

        // 임시 비밀번호 생성 (8자리 영숫자)
        String tempPw = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        user.setPassword(passwordEncoder.encode(tempPw));
        userRepository.save(user);

        // 실제 서비스에서는 이메일 발송 — 여기서는 임시 비밀번호를 응답으로 반환
        return tempPw;
    }
}
