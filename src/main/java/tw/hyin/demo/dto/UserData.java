package tw.hyin.demo.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * @author JHying(Rita) on 2022.
 * @description
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserData implements Serializable {

    private String userID;
    private String userName;

}
