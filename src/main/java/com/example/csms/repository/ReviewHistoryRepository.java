package com.example.csms.repository;

import com.example.csms.model.ReviewHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewHistoryRepository extends JpaRepository<ReviewHistory, Long> {
    // Custom query methods if needed, e.g., find by request or reviewer
}
