package com.example.csms.repository;

import com.example.csms.model.Institution;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InstitutionRepository extends JpaRepository<Institution, Long> {
    Optional<Institution> findByName(String name);
}
