from common.exceptions import ApplicationError


class InvalidCredentials(ApplicationError):
    """Wrong identifier or password. The message never says which one was wrong."""

    status_code = 401

    def __init__(self):
        super().__init__("Invalid credentials.")