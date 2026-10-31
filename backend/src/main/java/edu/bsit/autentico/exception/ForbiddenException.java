package edu.bsit.autentico.exception;

public class ForbiddenException extends RuntimeException {
    public String getMessage() { return super.getMessage(); }
    public ForbiddenException(String message) { super(message); }
}
