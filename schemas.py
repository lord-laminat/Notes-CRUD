from pydantic import BaseModel, Field
from typing import List

class TaskBase(BaseModel):
    title: str
    content: str

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int
    board_id: int

    class Config:
        from_attributes = True

class BoardBase(BaseModel):
    title: str = Field(..., min_length=1)  # Добавлена валидация

class BoardCreate(BoardBase):
    pass

class BoardList(BaseModel):  # Новая схема для списка досок
    id: int
    title: str

    class Config:
        from_attributes = True

class Board(BoardBase):
    id: int
    tasks: List[Task] = []

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str = Field(..., min_length=1)
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)

class UserOut(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str