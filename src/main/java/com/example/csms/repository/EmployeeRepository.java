package com.example.csms.repository;

import com.example.csms.model.Employee;
import com.example.csms.model.Institution;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmployeeEntityId(String employeeEntityId);
    List<Employee> findByInstitutionRef(Institution institution);
    List<Employee> findByNameContainingIgnoreCase(String name);
}
