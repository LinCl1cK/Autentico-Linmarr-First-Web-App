package edu.bsit.autentico;

import edu.bsit.autentico.service.UserService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class UserhubApplication {

	public static void main(String[] args) {
		SpringApplication.run(UserhubApplication.class, args);
	}

	// Runs once at startup: creates admin@example.com (role ADMIN) if no admin exists yet
	@Bean
	CommandLineRunner seedAdmin(UserService userService) {
		return args -> userService.seedAdminUser();
	}

}
