from typing import Annotated

from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.auth import AuthUser, get_auth_user
from app.core.db import get_db
from app.repositories.users import UserRepository
from app.services.users import UserService

DbDep = Annotated[AsyncIOMotorDatabase, Depends(get_db)]
AuthUserDep = Annotated[AuthUser, Depends(get_auth_user)]


def get_user_repository(db: DbDep) -> UserRepository:
    return UserRepository(db)


def get_user_service(
    users: Annotated[UserRepository, Depends(get_user_repository)],
) -> UserService:
    return UserService(users)


UserServiceDep = Annotated[UserService, Depends(get_user_service)]
