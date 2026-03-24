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
}
