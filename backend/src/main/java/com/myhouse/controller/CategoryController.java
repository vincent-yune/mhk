package com.myhouse.controller;

import com.myhouse.dto.response.ApiResponse;
import com.myhouse.entity.Category;
import com.myhouse.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Category>>> getRootCategories() {
        return ResponseEntity.ok(ApiResponse.success(categoryRepository.findByParentIsNullOrderBySortOrder()));
    }

    @GetMapping("/{parentId}/children")
    public ResponseEntity<ApiResponse<List<Category>>> getChildren(@PathVariable Long parentId) {
        return ResponseEntity.ok(ApiResponse.success(categoryRepository.findByParentIdOrderBySortOrder(parentId)));
    }
}
