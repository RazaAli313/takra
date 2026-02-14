from pydantic import BaseModel

class OTPAdmin(BaseModel):

    otp: int