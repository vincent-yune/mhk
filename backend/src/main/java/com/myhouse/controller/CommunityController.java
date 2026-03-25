package com.myhouse.controller;

import com.myhouse.dto.response.ApiResponse;
import com.myhouse.dto.response.CommunityPostResponse;
import com.myhouse.entity.CommunityPost;
import com.myhouse.service.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CommunityPostResponse>>> getPosts(
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        Page<CommunityPostResponse> posts = communityService.getPosts(type, page, size)
                .map(CommunityPostResponse::from);
        return ResponseEntity.ok(ApiResponse.success(posts));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<ApiResponse<CommunityPostResponse>> getPost(@PathVariable Long postId) {
        return ResponseEntity.ok(ApiResponse.success(CommunityPostResponse.from(communityService.getPost(postId))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CommunityPostResponse>> createPost(
            @RequestBody CommunityPost post,
            @AuthenticationPrincipal UserDetails ud) {
        CommunityPostResponse saved = CommunityPostResponse.from(communityService.createPost(ud.getUsername(), post));
        return ResponseEntity.ok(ApiResponse.success("게시글 등록 완료", saved));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<ApiResponse<CommunityPostResponse>> updatePost(
            @PathVariable Long postId,
            @RequestBody CommunityPost post,
            @AuthenticationPrincipal UserDetails ud) {
        CommunityPostResponse updated = CommunityPostResponse.from(communityService.updatePost(postId, ud.getUsername(), post));
        return ResponseEntity.ok(ApiResponse.success("게시글 수정 완료", updated));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetails ud) {
        communityService.deletePost(postId, ud.getUsername());
        return ResponseEntity.ok(ApiResponse.success("게시글 삭제 완료", null));
    }
}
