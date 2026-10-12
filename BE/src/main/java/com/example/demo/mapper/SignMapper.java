package com.example.demo.mapper;

import com.example.demo.dto.request.sign.SignRequest;
import com.example.demo.dto.response.sign.SignResponse;
import com.example.demo.entities.Sign;
import com.example.demo.entities.Topic;
import org.springframework.stereotype.Component;

@Component
public class SignMapper {

    public SignResponse toSignResponse(Sign sign) {
        if (sign == null) {
            return null;
        }

        Long topicId = sign.getTopic() != null ? sign.getTopic().getTopicId() : null;
        String topicName = sign.getTopic() != null ? sign.getTopic().getName() : null;

        return SignResponse.builder()
                .signId(sign.getSignId())
                .topicId(topicId)
                .topicName(topicName)
                .contentType(sign.getContentType())
                .nameVi(sign.getNameVi())
                .ipa(sign.getIpa())
                .englishName(sign.getEnglishName())
                .duration(sign.getDuration())
                .videoUrl(sign.getVideoUrl())
                .videoThumb(sign.getVideoThumb())
                .description(sign.getDescription())
                .stepsJson(sign.getStepsJson())
                .culturalNote(sign.getCulturalNote())
                .difficulty(sign.getDifficulty())
                .isActive(sign.getIsActive())
                .createdAt(sign.getCreatedAt())
                .build();
    }

    public Sign toEntity(SignRequest request, Topic topic) {
        if (request == null) {
            return null;
        }

        return Sign.builder()
                .topic(topic)
                .contentType(request.getContentType() != null ? request.getContentType() : "sign")
                .nameVi(request.getNameVi())
                .ipa(request.getIpa())
                .englishName(request.getEnglishName())
                .duration(request.getDuration())
                .videoUrl(request.getVideoUrl())
                .videoThumb(request.getVideoThumb())
                .description(request.getDescription())
                .stepsJson(request.getStepsJson())
                .culturalNote(request.getCulturalNote())
                .difficulty(request.getDifficulty() != null ? request.getDifficulty() : 1)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
    }

    public void updateEntity(Sign sign, SignRequest request, Topic topic) {
        if (sign == null || request == null) {
            return;
        }

        if (topic != null) {
            sign.setTopic(topic);
        }
        if (request.getContentType() != null) {
            sign.setContentType(request.getContentType());
        }
        if (request.getNameVi() != null && !request.getNameVi().isBlank()) {
            sign.setNameVi(request.getNameVi());
        }
        if (request.getIpa() != null) {
            sign.setIpa(request.getIpa());
        }
        if (request.getEnglishName() != null) {
            sign.setEnglishName(request.getEnglishName());
        }
        if (request.getDuration() != null) {
            sign.setDuration(request.getDuration());
        }
        if (request.getVideoUrl() != null) {
            sign.setVideoUrl(request.getVideoUrl());
        }
        if (request.getVideoThumb() != null) {
            sign.setVideoThumb(request.getVideoThumb());
        }
        if (request.getDescription() != null) {
            sign.setDescription(request.getDescription());
        }
        if (request.getStepsJson() != null) {
            sign.setStepsJson(request.getStepsJson());
        }
        if (request.getCulturalNote() != null) {
            sign.setCulturalNote(request.getCulturalNote());
        }
        if (request.getDifficulty() != null) {
            sign.setDifficulty(request.getDifficulty());
        }
        if (request.getIsActive() != null) {
            sign.setIsActive(request.getIsActive());
        }
    }
}
