package edu.bsit.autentico.exception;

public class AuthException extends RuntimeException {
    public String getMessage() { return super.getMessage(); }
    public AuthException(String message) { super(message); }
}
