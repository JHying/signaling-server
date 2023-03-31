package tw.hyin.demo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

/**
 * @author JHying(Rita) on 2022.
 * @description
 */
@Controller
public class WebSocketController {

    /**
     * 通訊用 api
     */
    @RequestMapping("call/{username}.html")
    public ModelAndView socketChartPage(@PathVariable String username) {
        ModelAndView modelAndView = new ModelAndView();
        modelAndView.setViewName("index.html");
        modelAndView.addObject("username", username);
        return modelAndView;
    }

    /**
     * 通訊用 api
     */
    @RequestMapping("call/{username}.html/{target}")
    public ModelAndView callSpecific(@PathVariable String username, @PathVariable String target) {
        ModelAndView modelAndView = new ModelAndView();
        modelAndView.setViewName("index.html");
        modelAndView.addObject("username", username);
        modelAndView.addObject("target", target);
        return modelAndView;
    }

}
