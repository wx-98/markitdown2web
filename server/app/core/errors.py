from fastapi import HTTPException, status


class FileTooLargeError(HTTPException):
    def __init__(self, max_mb: int):
        super().__init__(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds the {max_mb} MB limit.",
        )


class ConversionError(HTTPException):
    def __init__(self, detail: str = "Failed to convert the document."):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
        )


class UnsupportedFileError(HTTPException):
    def __init__(self, filename: str):
        super().__init__(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {filename}",
        )
