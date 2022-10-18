package tw.hyin.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.retry.annotation.EnableRetry;

/**
 * @author YingHan 2021
 */
@EnableRetry
@SpringBootApplication
public class SignalingServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(SignalingServerApplication.class, args);
    }

}
