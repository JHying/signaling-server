package tw.hyin.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.server.standard.ServerEndpointExporter;

/**
 * @author JHying(Rita) on 2022.
 * @description spring boot 會自動註冊使用 ServerEndpoint 的對象，若沒註冊 client 會無法連線
 */
@Configuration
public class WebSocketConfig {

    @Bean
    public ServerEndpointExporter serverEndpointExporter() {
        return new ServerEndpointExporter();
    }
}
