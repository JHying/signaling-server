package tw.hyin.demo;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

/**
 * 
 * @author YingHan
 * @since 2022-03-17
 * 
 * @Description Log 記錄工具
 */
public class Log {

	private static final Logger LOGGER = LogManager.getLogger();

	private Log() {
		/* cannot be instantiated */
		throw new UnsupportedOperationException("cannot be instantiated.");
	}

	public static Logger getLogger() {
		return LOGGER;
	}

	public static void trace(String msg) {
		LOGGER.trace(msg);
	}

	public static void debug(String msg) {
		LOGGER.debug(msg);
	}

	public static void info(String msg) {
		LOGGER.info(msg);
	}

	public static void info(String msg, Object... param) {
		LOGGER.info(msg, param);
	}

	public static void warn(String msg) {
		LOGGER.warn(msg);
	}

	public static void error(String msg) {
		LOGGER.error(msg);
	}

	public static void error(String msg, Object... param) {
		LOGGER.error(msg, param);
	}

}
