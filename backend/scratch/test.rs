fn main() {
    #[derive(Debug)]
    enum Status { OPEN, CLOSED }
    println!("Formatted: {}", format!("{:?}", Status::CLOSED));
}
