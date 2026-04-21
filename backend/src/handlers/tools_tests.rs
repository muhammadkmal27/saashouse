#[cfg(test)]
mod tests {
    use crate::handlers::tools::parse_whois_availability;

    #[test]
    fn test_parse_whois_available_iana() {
        let response = "This domain is not found in the IANA database.";
        assert!(parse_whois_availability(response));
    }

    #[test]
    fn test_parse_whois_available_free() {
        let response = "domain name: example.com is free";
        assert!(parse_whois_availability(response));
    }

    #[test]
    fn test_parse_whois_available_my() {
        let response = "Domain Name [example.my] does not exist in database";
        assert!(parse_whois_availability(response));
    }

    #[test]
    fn test_parse_whois_registered() {
        let response = "Domain Name: google.com\nRegistry Domain ID: 2138514_DOMAIN_COM-VRSN";
        assert!(!parse_whois_availability(response));
    }
}
