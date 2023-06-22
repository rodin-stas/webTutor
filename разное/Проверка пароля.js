function checkPassword() {
	var s_letters = "qwertyuiopasdfghjklzxcvbnm";
	var b_letters = "QWERTYUIOPLKJHGFDSAZXCVBNM"; 
	var digits = "0123456789"; 
	var is_s = false; 
	var is_b = false;
	var is_d = false;
	if (StrCharCount(PASSWORD) >= 9 && StrCharCount(PASSWORD) < 30) {
		for (i = 0; i < StrCharCount(PASSWORD); i++) {
			if (!is_s && StrContains(s_letters, PASSWORD.charAt(i))) {
				 is_s = true 
			} else if (!is_b && StrContains(b_letters, PASSWORD.charAt(i))) { 
				is_b = true 
			} else if (!is_d && StrContains(digits, PASSWORD.charAt(i))) {
				 is_d = true 
			} 
		} 
		if (is_s && is_b && is_d) { 
			return true 
		} 
	} return false 
} return checkPassword();