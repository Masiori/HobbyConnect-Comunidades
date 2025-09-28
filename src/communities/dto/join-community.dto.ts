import { IsString, IsNotEmpty } from 'class-validator';

export class JoinCommunityDto {
  @IsString()
  @IsNotEmpty()
  id:string;
  
}
