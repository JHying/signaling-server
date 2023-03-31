# Introduction

視訊 Server - WebRTC + WebSocket
為支援不同客戶端，使用 SDP (session description protocol) 作為通訊協定
連線: http://localhost:8996/signal/call/{username}.html

(本專案不包含 ssl - p12 檔)

1. 開發環境：IntelliJ IDEA 2022.1

2. 專案建置：Maven 3.8.2

3. 語言版本：JAVA JDK 11

4. 執行：jar as service

5. 主框架：spring boot 2.7.4 (set as maven parent)

6. Log：spring-boot-starter-logging (含 logback 1.2.11)

### Detail

1. 設定檔位置：src.main.resources

2. 使用 maven build

3. 包含兩種環境配置：dev & prod

4. 可依據 maven build 參數決定要 build 的檔案（dev 配置檔放在 dev 資料夾，prod 配置檔放在 prod 資料夾）

5. logback-test.xml：log 配置檔－－分別產生 INFO 及 ERROR 資訊的 Log 檔
