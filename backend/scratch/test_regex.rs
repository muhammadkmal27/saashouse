use regex::Regex;

fn main() {
    let re = Regex::new(r"^(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$").unwrap();
    let pass = "SecurePassword123!";
    println!("Pass: {}, Match: {}", pass, re.is_match(pass));
    
    let pass2 = "NoSymbol123";
    println!("Pass: {}, Match: {}", pass2, re.is_match(pass2));
}
