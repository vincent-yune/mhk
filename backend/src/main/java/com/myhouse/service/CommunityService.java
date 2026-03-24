package com.myhouse.service;

import com.myhouse.entity.*;
import com.myhouse.exception.ResourceNotFoundException;
import com.myhouse.exception.UnauthorizedException;
import com.myhouse.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private final CommunityPostRepository postRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<CommunityPost> getPosts(String postType, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        if (postType != null && !postType.isEmpty()) {
            CommunityPost.PostType type = CommunityPost.PostType.valueOf(postType.toUpperCase());
            return postRepository.findByPostTypeAndStatus(type, CommunityPost.PostStatus.ACTIVE, pageable);
        }
        return postRepository.findByStatus(CommunityPost.PostStatus.ACTIVE, pageable);
    }

    @Transactional(readOnly = true)
    public CommunityPost getPost(Long postId) {
        CommunityPost post = findPost(postId);
        post.setViewCount(post.getViewCount() + 1);
        postRepository.save(post);
        return post;
    }

    @Transactional
    public CommunityPost createPost(String email, CommunityPost post) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        post.setUser(user);
        return postRepository.save(post);
    }

    @Transactional
    public CommunityPost updatePost(Long postId, String email, CommunityPost updated) {
        CommunityPost post = findPost(postId);
        checkOwner(post, email);
        if (updated.getTitle() != null) post.setTitle(updated.getTitle());
        if (updated.getContent() != null) post.setContent(updated.getContent());
        if (updated.getPrice() != null) post.setPrice(updated.getPrice());
        if (updated.getStatus() != null) post.setStatus(updated.getStatus());
        return postRepository.save(post);
    }

    @Transactional
    public void deletePost(Long postId, String email) {
        CommunityPost post = findPost(postId);
        checkOwner(post, email);
        postRepository.delete(post);
    }

    private CommunityPost findPost(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("게시글을 찾을 수 없습니다."));
    }

    private void checkOwner(CommunityPost post, String email) {
        if (!post.getUser().getEmail().equals(email)) {
            throw new UnauthorizedException("작성자만 수정/삭제할 수 있습니다.");
        }
    }
}
