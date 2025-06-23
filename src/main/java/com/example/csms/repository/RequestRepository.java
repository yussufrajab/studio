package com.example.csms.repository;

import com.example.csms.model.Request;
import com.example.csms.model.RequestStatus;
import com.example.csms.model.User;
import com.example.csms.model.Employee;
import com.example.csms.model.Institution;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RequestRepository extends JpaRepository<Request, Long> {
    List<Request> findByEmployee(Employee employee);
    List<Request> findBySubmittedBy(User user);
    List<Request> findByStatus(RequestStatus status);
    // For HRRP: Find requests submitted by HROs within their institution
    List<Request> findByEmployee_InstitutionRef(Institution institution);
}
