package com.myhouse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class MyhouseApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyhouseApplication.class, args);
    }
}
