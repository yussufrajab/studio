package com.yussufrajab.csms.security;

import com.yussufrajab.csms.entity.User;
import com.yussufrajab.csms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found with username: " + username));

        // Check for account lockout (NFR1.4)
        if (user.getAccountLockoutTime() != null && LocalDateTime.now().isBefore(user.getAccountLockoutTime().plusMinutes(15))) {
            // Even though UserDetails.isAccountNonLocked() handles this,
            // throwing an exception here can give a more specific message if desired.
            // For now, relying on the User entity's isAccountNonLocked method.
        }

        return user;
    }
}
