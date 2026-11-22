class ApplicationError(Exception):
    status_code = 400

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class NotFound(ApplicationError):
    status_code = 404


class Conflict(ApplicationError):
    status_code = 409


class Forbidden(ApplicationError):
    status_code = 403
