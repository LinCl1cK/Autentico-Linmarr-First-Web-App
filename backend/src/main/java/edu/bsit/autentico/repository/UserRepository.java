package edu.bsit.autentico.repository;

import edu.bsit.autentico.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Used during Login to find a user by their unique email
    Optional<User> findByEmail(String email);

    // Used during Registration to check if an email is already taken
    boolean existsByEmail(String email);

    // Used at startup to check whether any account already has the given role (e.g. "ADMIN")
    boolean existsByRole(String role);
}
